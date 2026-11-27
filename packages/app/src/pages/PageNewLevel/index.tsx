import { useEffect, useMemo, useState } from 'react';
import { Button, FileInput, Group, Image, NumberInput, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router';
import { apiPostLevel } from '@/api/level';

export function PageNewLevel() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [cols, setCols] = useState<number | string>(4);
    const [rows, setRows] = useState<number | string>(4);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const preview = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);

    useEffect(() => {
        if (!preview) return;
        return () => URL.revokeObjectURL(preview);
    }, [preview]);

    async function submit() {
        if (!file) return;
        setLoading(true);
        setError('');
        const body = new FormData();
        body.append('image', file);
        body.append('name', name);
        body.append('cols', String(cols));
        body.append('rows', String(rows));
        try {
            await apiPostLevel(body);
            notifications.show({ message: '关卡已创建' });
            navigate('/puzzle');
        }
        catch (error_) {
            setError((error_ as Error).message);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <Stack maw={480}>
            <TextInput label="关卡名称" value={name} onChange={event => setName(event.currentTarget.value)} />
            <FileInput label="图片" placeholder="选择图片" accept="image/*" value={file} onChange={setFile} />
            {preview && <Image src={preview} h={200} fit="contain" />}
            <Group grow>
                <NumberInput label="列数 m" min={2} max={10} value={cols} onChange={setCols} />
                <NumberInput label="行数 n" min={2} max={10} value={rows} onChange={setRows} />
            </Group>
            {error && <Text c="red" size="sm">{error}</Text>}
            <Button onClick={submit} loading={loading} disabled={!file || !name.trim()}>创建关卡</Button>
        </Stack>
    );
}
