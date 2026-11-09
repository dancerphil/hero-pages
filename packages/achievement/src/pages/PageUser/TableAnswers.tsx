import { Badge, Button, Table } from '@mantine/core';
import type { AnswerRecord } from '@/server/user';
import { BadgeTier } from '@/ui/BadgeTier';

export function TableAnswers(props: { answers: AnswerRecord[]; onEdit: (record: AnswerRecord) => void }) {
    return (
        <Table.ScrollContainer minWidth={480}>
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>成就</Table.Th>
                        <Table.Th>档位</Table.Th>
                        <Table.Th>我的回答</Table.Th>
                        <Table.Th>结果</Table.Th>
                        <Table.Th>提交时间</Table.Th>
                        <Table.Th />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {props.answers.map(record => (
                        <Table.Tr key={record.id}>
                            <Table.Td>{record.title}</Table.Td>
                            <Table.Td>
                                <BadgeTier tier={record.tier} />
                            </Table.Td>
                            <Table.Td>{record.answer}</Table.Td>
                            <Table.Td>
                                <Badge color={record.passed ? 'green' : 'red'} variant="light">
                                    {record.passed ? '通过' : '未通过'}
                                </Badge>
                            </Table.Td>
                            <Table.Td>{record.createdAt}</Table.Td>
                            <Table.Td>
                                <Button size="xs" variant="light" onClick={() => props.onEdit(record)}>
                                    修改
                                </Button>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
}
