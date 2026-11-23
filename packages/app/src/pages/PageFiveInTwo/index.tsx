import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import '@/styles/simplePage';
import { FiveInTwo } from './FiveInTwo';

export const PageFiveInTwo = () => (
    <div className="simplePage">
        <MantineProvider>
            <FiveInTwo />
        </MantineProvider>
    </div>
);
