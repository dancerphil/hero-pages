import { Button, Container, Stack, Title } from '@mantine/core';
import { useNavigate } from 'react-router';

export function PageHome() {
    const navigate = useNavigate();
    return (
        <Container size="xs" py="xl">
            <Stack>
                <Title order={3} ta="center">dancerphil</Title>
                <Button size="lg" onClick={() => navigate('/achievement')}>成就</Button>
                <Button size="lg" variant="light" onClick={() => navigate('/puzzle')}>拼图</Button>
            </Stack>
        </Container>
    );
}
