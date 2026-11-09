import { type Dispatch, type SetStateAction, useState } from 'react';
import { Button, Card, Checkbox, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

export interface NameDraft { key: number; text: string; selected: boolean }

export function SectionNames(props: {
    names: NameDraft[];
    setNames: Dispatch<SetStateAction<NameDraft[]>>;
    generating: boolean;
    onGenerate: () => void;
}) {
    const { names, setNames } = props;
    const [newName, setNewName] = useState('');

    function updateName(key: number, patch: Partial<NameDraft>) {
        setNames(prev => prev.map(name => (name.key === key ? { ...name, ...patch } : name)));
    }

    function addName() {
        if (!newName.trim()) return;
        setNames(prev => [...prev, { key: Date.now(), text: newName.trim(), selected: true }]);
        setNewName('');
    }

    return (
        <Card withBorder>
            <Stack>
                <Text fw={500}>第一步：确认成就名称</Text>
                {names.map(name => (
                    <Group key={name.key} wrap="nowrap">
                        <Checkbox
                            checked={name.selected}
                            onChange={event => updateName(name.key, { selected: event.currentTarget.checked })}
                        />
                        <TextInput
                            style={{ flex: 1 }}
                            value={name.text}
                            onChange={event => updateName(name.key, { text: event.currentTarget.value })}
                        />
                        <Button
                            variant="subtle"
                            color="red"
                            onClick={() => setNames(prev => prev.filter(item => item.key !== name.key))}
                        >
                            <IconTrash size={16} />
                        </Button>
                    </Group>
                ))}
                <Group wrap="nowrap">
                    <TextInput
                        style={{ flex: 1 }}
                        placeholder="手动添加一个名称"
                        value={newName}
                        onChange={event => setNewName(event.currentTarget.value)}
                        onKeyDown={event => event.key === 'Enter' && addName()}
                    />
                    <Button variant="light" onClick={addName} disabled={!newName.trim()}>添加</Button>
                </Group>
                <Button
                    onClick={props.onGenerate}
                    loading={props.generating}
                    disabled={!names.some(name => name.selected && name.text.trim())}
                >
                    生成细节
                </Button>
            </Stack>
        </Card>
    );
}
