import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Mbti } from './Mbti';

export const PageMbti = () => (
    <div className="simplePage">
        <MantineProvider>
            <Mbti />
        </MantineProvider>
    </div>
);
