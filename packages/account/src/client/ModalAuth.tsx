import { useEffect, useState } from 'react';
import { Anchor, Button, Group, Modal, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import type { UserRow } from '../types';
import { fetchApi } from './api';

type AuthMode = 'login' | 'register' | 'reset';

const TITLES: Record<AuthMode, string> = {
    login: '登录',
    register: '注册',
    reset: '重置密码',
};

const SUBMIT_PATHS: Record<AuthMode, string> = {
    login: '/api/auth/login',
    register: '/api/auth/register',
    reset: '/api/auth/password-reset',
};

export function ModalAuth(props: { opened: boolean; onClose: () => void; onSuccess: (user: UserRow) => void }) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown === 0) return;
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    function changeMode(next: AuthMode) {
        setMode(next);
        setError('');
    }

    async function sendCode() {
        setError('');
        try {
            await fetchApi({ path: '/api/auth/email-codes', body: { email, purpose: mode === 'register' ? 'register' : 'reset' } });
            setCountdown(60);
        }
        catch (error_) {
            setError((error_ as Error).message);
        }
    }

    async function submit() {
        setLoading(true);
        setError('');
        try {
            const user = await fetchApi<UserRow>({ path: SUBMIT_PATHS[mode], body: { email, code, password } });
            props.onSuccess(user);
        }
        catch (error_) {
            setError((error_ as Error).message);
        }
        finally {
            setLoading(false);
        }
    }

    const isLogin = mode === 'login';

    return (
        <Modal opened={props.opened} onClose={props.onClose} title={TITLES[mode]} centered>
            <Stack>
                <TextInput label="邮箱" type="email" value={email} onChange={event => setEmail(event.currentTarget.value)} />
                {!isLogin && (
                    <Group align="flex-end" wrap="nowrap">
                        <TextInput
                            label="验证码"
                            value={code}
                            onChange={event => setCode(event.currentTarget.value)}
                            style={{ flex: 1 }}
                        />
                        <Button variant="light" onClick={sendCode} disabled={countdown > 0 || !email}>
                            {countdown > 0 ? `${countdown} 秒后重发` : '发送验证码'}
                        </Button>
                    </Group>
                )}
                <PasswordInput
                    label={mode === 'reset' ? '新密码' : '密码'}
                    value={password}
                    onChange={event => setPassword(event.currentTarget.value)}
                />
                {error && <Text c="red" size="sm">{error}</Text>}
                <Button onClick={submit} loading={loading}>
                    {TITLES[mode]}
                </Button>
                {isLogin ? (
                    <Group justify="space-between">
                        <Anchor size="sm" onClick={() => changeMode('register')}>注册新账号</Anchor>
                        <Anchor size="sm" onClick={() => changeMode('reset')}>忘记密码</Anchor>
                    </Group>
                ) : (
                    <Anchor size="sm" onClick={() => changeMode('login')}>返回登录</Anchor>
                )}
            </Stack>
        </Modal>
    );
}
