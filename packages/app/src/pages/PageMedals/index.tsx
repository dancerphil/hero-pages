import { useEffect, useState } from 'react';
import { Card, SimpleGrid, Stack, Table, Tabs, Text, TextInput, Title } from '@mantine/core';
import { useParams } from 'react-router';
import type { AnswerRecord, UserPage, UserRow } from '@/shared/user';
import { apiGetUser, apiGetUserAnswers } from '@/api/user';
import { ModalAnswer } from '@/modules/Answer/ModalAnswer';
import { BadgeTier } from '@/ui/BadgeTier';
import { TIERS_DESC } from '@/utils/tier';
import { TableAnswers } from './TableAnswers';

export function PageMedals(props: { user: UserRow }) {
    const { uid = '' } = useParams();
    const [page, setPage] = useState<UserPage | null>(null);
    const [answers, setAnswers] = useState<AnswerRecord[]>([]);
    const [editing, setEditing] = useState<AnswerRecord | null>(null);
    const [keyword, setKeyword] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const isSelf = props.user.uid === uid;

    useEffect(() => {
        async function load() {
            setPage(await apiGetUser({ uid }));
            if (isSelf) setAnswers(await apiGetUserAnswers({ uid }));
        }
        load();
    }, [uid, isSelf, reloadKey]);

    if (!page) return null;

    const visible = page.unlocks.filter(unlock => unlock.title.includes(keyword.trim()));

    return (
        <Stack>
            <div>
                <Title order={3}>{page.username}</Title>
                <Text size="sm" c="dimmed">ID：{page.uid}</Text>
            </div>
            <SimpleGrid cols={3}>
                {TIERS_DESC.map(tier => (
                    <Card key={tier} withBorder>
                        <BadgeTier tier={tier} />
                        <Text size="xl" fw={700} mt="xs">
                            {page.unlocks.filter(unlock => unlock.tier === tier).length}
                        </Text>
                    </Card>
                ))}
            </SimpleGrid>
            <Tabs defaultValue="unlocked">
                <Tabs.List>
                    <Tabs.Tab value="unlocked">已获得</Tabs.Tab>
                    {isSelf && <Tabs.Tab value="answers">答题记录</Tabs.Tab>}
                </Tabs.List>
                <Tabs.Panel value="unlocked" pt="md">
                    <Stack>
                        <TextInput
                            placeholder="按成就名查找"
                            value={keyword}
                            onChange={event => setKeyword(event.currentTarget.value)}
                        />
                        <Table.ScrollContainer minWidth={480}>
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>成就</Table.Th>
                                        <Table.Th>档位</Table.Th>
                                        <Table.Th>获得时间</Table.Th>
                                        <Table.Th>稀有度</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {visible.map(unlock => (
                                        <Table.Tr key={unlock.questionId}>
                                            <Table.Td>{unlock.title}</Table.Td>
                                            <Table.Td>
                                                <BadgeTier tier={unlock.tier} />
                                            </Table.Td>
                                            <Table.Td>{unlock.unlockedAt}</Table.Td>
                                            <Table.Td>{unlock.rarity} 人获得</Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Stack>
                </Tabs.Panel>
                {isSelf && (
                    <Tabs.Panel value="answers" pt="md">
                        <TableAnswers answers={answers} onEdit={setEditing} />
                    </Tabs.Panel>
                )}
            </Tabs>
            {editing && (
                <ModalAnswer
                    achievementId={editing.achievementId}
                    question={editing}
                    initialAnswer={editing.answer}
                    onClose={() => setEditing(null)}
                    onSubmitted={() => setReloadKey(key => key + 1)}
                />
            )}
        </Stack>
    );
}
