<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    /**
     * Gives every controller `$this->authorize()`.
     *
     * Authorisation is written out per action rather than through
     * `authorizeResource()`: it is one line, it reads in the method it guards,
     * and it does not depend on the controller also carrying route middleware.
     */
    use AuthorizesRequests;
}
