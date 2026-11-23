import { useState } from 'react';
import { Button, Group, Popover, Stack, TextInput, UnstyledButton } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { ReadSettings } from './ReadSettings';
import c from './Read.module.css';

interface BarNovelProps {
    name: string;
    percent: number;
    onBack: () => void;
    onRename: (name: string) => void;
}

export const BarNovel = ({ name, percent, onBack, onRename }: BarNovelProps) => {
    const [expanded, setExpanded] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [draft, setDraft] = useState('');

    const openRename = () => {
        setDraft(name);
        setRenaming(true);
    };

    const commitRename = () => {
        const next = draft.trim();
        setRenaming(false);
        if (next && next !== name) {
            onRename(next);
        }
    };

    return (
        <Group className={c.bar} gap={2}>
            {expanded && (
                <>
                    <UnstyledButton className={c.item} onClick={onBack} aria-label="返回">
                        <IconArrowLeft size={14} />
                    </UnstyledButton>
                    <ReadSettings />
                    <Popover
                        opened={renaming}
                        onChange={opened => (opened ? openRename() : commitRename())}
                        position="bottom-end"
                        withArrow
                        shadow="md"
                    >
                        <Popover.Target>
                            <UnstyledButton className={c.title} onClick={() => (renaming ? commitRename() : openRename())}>
                                <span className={c.titleText}>{name}</span>
                            </UnstyledButton>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <Stack gap={4}>
                                <TextInput
                                    autoFocus
                                    value={draft}
                                    onChange={e => setDraft(e.currentTarget.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            commitRename();
                                        }
                                    }}
                                />
                                <Button size="xs" onClick={commitRename}>确认</Button>
                            </Stack>
                        </Popover.Dropdown>
                    </Popover>
                </>
            )}
            <UnstyledButton className={c.item} onClick={() => setExpanded(!expanded)}>
                {percent}%
            </UnstyledButton>
        </Group>
    );
};
