import { Modal, Stack, Text } from '@mantine/core';
import { BadgeTier } from '@/ui/BadgeTier';
import { FormAnswer, type AnswerQuestion } from './FormAnswer';

export function ModalAnswer(props: {
    achievementId: number;
    question: AnswerQuestion;
    initialAnswer?: string;
    onClose: () => void;
    onSubmitted: () => void;
}) {
    return (
        <Modal opened onClose={props.onClose} title={<BadgeTier tier={props.question.tier} />} centered>
            <Stack>
                <Text>{props.question.prompt}</Text>
                <FormAnswer
                    achievementId={props.achievementId}
                    question={props.question}
                    initialAnswer={props.initialAnswer}
                    onSubmitted={(passed) => {
                        props.onSubmitted();
                        if (passed) props.onClose();
                    }}
                />
            </Stack>
        </Modal>
    );
}
