import { Fragment } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Box, Container, Divider, NavLink, Paper } from '@mantine/core';
import { Markdown } from '@hero-u/mantine';
import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { mathArticles } from './contents';

export const PageMath = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const article = mathArticles.find(item => item.slug === slug);

    if (!article) {
        return <Navigate to="/math/category" replace />;
    }

    return (
        <div className="simplePage">
            <MantineProvider>
                <Box pos="fixed" top={60} left={12}>
                    <Paper withBorder shadow="md" p={4}>
                        {mathArticles.map(item => (
                            <NavLink
                                key={item.slug}
                                label={item.title}
                                active={item.slug === article.slug}
                                onClick={() => navigate(`/math/${item.slug}`)}
                            />
                        ))}
                    </Paper>
                </Box>
                <Container size="md" py={60}>
                    {article.contents.map((content, index) => (
                        <Fragment key={index}>
                            {index > 0 && <Divider my="xl" />}
                            <Markdown enableMath>{content}</Markdown>
                        </Fragment>
                    ))}
                </Container>
            </MantineProvider>
        </div>
    );
};
