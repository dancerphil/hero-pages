import { useEffect, useState } from 'react';
import { Button, Skeleton, Box } from '@mantine/core';
import { Markdown } from '@hero-u/mantine';
import { type StreamParams, streamSentence } from './utils';
import { getNodes, resetActiveNodeKey } from './region';

const handleClose = () => {
    resetActiveNodeKey();
    window.location.hash = '';
};

export const Stream = ({ activeNodeKey }: { activeNodeKey: string }) => {
    const [content, setContent] = useState<string>('');

    useEffect(
        () => {
            const controller = new AbortController();

            const asyncEffect = async () => {
                try {
                    setContent('');

                    const nodes = getNodes();
                    const params: StreamParams = {};

                    nodes?.forEach((node) => {
                        if (node.dataset.key === activeNodeKey) {
                            params['sentence'] = node.textContent || '';
                        }
                        if (node.dataset.key.startsWith(activeNodeKey) && node.dataset.key !== activeNodeKey) {
                            params['children'] ||= [];
                            params['children'].push(node.textContent || '');
                        }
                        if (node.dataset.key === activeNodeKey.slice(0, -1)) {
                            params['parent'] = node.textContent || '';
                        }
                    });

                    const { textStream } = streamSentence(params, controller.signal);

                    for await (const textPart of textStream) {
                        setContent(v => v + textPart);
                    }
                }
                catch (error) {
                    if (!(error instanceof Error) || error.name !== 'AbortError') {
                        throw error;
                    }
                }
            };

            asyncEffect();

            return () => controller.abort();
        },
        [activeNodeKey],
    );

    return (
        <Box
            p={20}
            pos="sticky"
            top={0}
            h="100vh"
            style={{ lineHeight: 1.5, overflowY: 'auto' }}
        >
            <Button variant="default" onClick={handleClose}>× Close</Button>
            {content ? (
                <Markdown>{content}</Markdown>
            ) : <Skeleton height={200} />}
        </Box>
    );
};
