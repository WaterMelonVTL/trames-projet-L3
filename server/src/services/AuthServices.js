import { catchError } from "./errorServices";
import { jwtVerify } from "jose";


export function roleAbove(role1, role2) {
    const Roles = {
        "ADMIN": 1,
        "MODERATOR": 2,
        "USER": 3
    };// I admit that this is ok because I should not need to create new roles really often.
    return Roles[role1] <= Roles[role2];
}

export async function verifyAuthorization(token, role_min = "USER", needEmailVerified = false) {
    const encoder = new TextEncoder();
    const secret = globalThis.TOKEN_SECRET;
    if (!secret) {
        console.error('TOKEN_SECRET is not configured');
        return [false, null];
    }
    const secretKey = encoder.encode(secret);
    const [tokenError, result] = await catchError(jwtVerify(token, secretKey));

    if (tokenError || !result) {
        console.error('Token verification failed:', tokenError?.message || 'No result');
        return [false, null];
    }

    const { payload } = result;
    if (!payload) {
        console.error('No payload in token');
        return [false, null];
    }

    const role = payload.Role;
    return [roleAbove(role, role_min), payload];
}

export function getAuthorizationToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        console.error('Authorization header missing');
        return null;
    }

    const [authType, authValue] = authHeader.split(' ');
    if (authType !== 'Bearer' || !authValue) {
        console.error('Invalid Authorization header format');
        return null;
    }

    return authValue;
}

export async function needRole(request, role) {
    const authValue = getAuthorizationToken(request);
    console.log('Auth value:', authValue);

    if (!authValue) {
        return [false, null];
    }
    return await verifyAuthorization(authValue, role);
}

export async function isUser(request, userId) {
    const authValue = getAuthorizationToken(request);
    if (!authValue) {
        return [false, null];
    }
    const [authorized, userInfo] = await verifyAuthorization(authValue);
    if (!authorized) {
        return [false, null];
    }
    return [userInfo.UserId === userId, userInfo];
}

