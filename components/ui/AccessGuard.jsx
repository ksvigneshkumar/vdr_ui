// src/components/ui/AccessGuard.jsx
import React from 'react';
import { hasPermission } from '@/lib/access/permissions';

export default function AccessGuard({ role, action, children, fallback = null }) {
    const isAllowed = hasPermission(role, action);

    if (!isAllowed) {
        return fallback;
    }

    return <>{children}</>;
}