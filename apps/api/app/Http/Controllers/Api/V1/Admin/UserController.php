<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        return response()->json(
            User::query()
                ->select(['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'two_factor_confirmed_at'])
                ->orderBy('name')
                ->paginate(min($request->integer('per_page', 50), 100)),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()->symbols()->uncompromised()],
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        // Nobody creates an account more powerful than their own.
        $this->assertRoleWithinReach($request->user(), UserRole::from($data['role']));

        $user = User::create($data);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role'])], 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'data' => $user->only(['id', 'name', 'email', 'role', 'is_active', 'last_login_at']),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'email' => ['sometimes', 'email', 'max:180', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['sometimes', 'confirmed', Password::min(12)->letters()->mixedCase()->numbers()->symbols()->uncompromised()],
            'role' => ['sometimes', Rule::enum(UserRole::class)],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['role'])) {
            $this->assertRoleWithinReach($request->user(), UserRole::from($data['role']));
        }

        // Deactivating or re-roling an account must not leave live tokens with
        // the old abilities in circulation.
        if (array_key_exists('role', $data) || array_key_exists('is_active', $data) || array_key_exists('password', $data)) {
            $user->tokens()->delete();
        }

        $user->update($data);

        return response()->json(['data' => $user->only(['id', 'name', 'email', 'role', 'is_active'])]);
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->tokens()->delete();
        $user->delete();

        return response()->json(null, 204);
    }

    private function assertRoleWithinReach(User $actor, UserRole $target): void
    {
        abort_unless(
            $actor->role->atLeast($target),
            403,
            'You cannot assign a role above your own.',
        );
    }
}
