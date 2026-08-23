<?php

declare(strict_types=1);

namespace App\Enums;

enum AuditAction: string
{
    case Created = 'created';
    case Updated = 'updated';
    case Deleted = 'deleted';
    case Restored = 'restored';
    case LoginSucceeded = 'login_succeeded';
    case LoginFailed = 'login_failed';
    case LoggedOut = 'logged_out';
    case TwoFactorEnabled = 'two_factor_enabled';
    case TwoFactorDisabled = 'two_factor_disabled';
    case MediaUploaded = 'media_uploaded';
    case MediaDeleted = 'media_deleted';
}
