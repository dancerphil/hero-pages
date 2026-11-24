import { useState } from 'react';
import { Avatar, Box, Button, Menu, UnstyledButton } from '@mantine/core';
import type { RouteObject } from 'react-router';
import { matchPath, useLocation, useNavigate } from 'react-router';
import { ModalAuth } from '@hero-pages/account/client';
import { avatarSrc } from '@/utils/avatar';
import { logout, userRegion } from '@/regions/user';

export function MenuNav(props: { routes: RouteObject[] }) {
    const user = userRegion.useValue();
    const { pathname } = useLocation();
    const [authOpened, setAuthOpened] = useState(false);
    const navigate = useNavigate();

    const paths = props.routes.map(route => (route.index ? '/' : `/${route.path?.replace(/\/\*$/, '')}`));

    if (matchPath('/read/:id', pathname)) {
        return null;
    }

    return (
        <>
            <Box pos="fixed" top={12} left={12}>
                <Menu position="bottom-start">
                    <Menu.Target>
                        {user?.email ? (
                            <UnstyledButton aria-label="菜单">
                                <Avatar src={avatarSrc({ uid: user.uid, avatarUpdatedAt: user.avatar_updated_at })}>
                                    {user.username.charAt(0).toUpperCase()}
                                </Avatar>
                            </UnstyledButton>
                        ) : (
                            <Button variant="default">登录</Button>
                        )}
                    </Menu.Target>
                    <Menu.Dropdown>
                        {user?.email ? (
                            <>
                                <Menu.Label>{user.username}</Menu.Label>
                                <Menu.Label>{user.email}</Menu.Label>
                                <Menu.Item onClick={logout}>退出</Menu.Item>
                            </>
                        ) : (
                            <Menu.Item onClick={() => setAuthOpened(true)}>登录 / 注册</Menu.Item>
                        )}
                        <Menu.Divider />
                        {paths.map(path => (
                            <Menu.Item key={path} onClick={() => navigate(path)}>
                                {path}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            </Box>
            <ModalAuth
                opened={authOpened}
                onClose={() => setAuthOpened(false)}
                onSuccess={(next) => {
                    userRegion.set(next);
                    setAuthOpened(false);
                }}
            />
        </>
    );
}
