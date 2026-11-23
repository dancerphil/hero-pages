import { Fragment } from 'react';
import { Container, Divider } from '@mantine/core';
import { Markdown } from './Markdown';
import { contents } from './contents';

export const Category = () => {
    return (
        <Container size="md" py={60}>
            {contents.map((content, index) => (
                <Fragment key={index}>
                    {index > 0 && <Divider my="xl" />}
                    <Markdown>{content}</Markdown>
                </Fragment>
            ))}
        </Container>
    );
};
