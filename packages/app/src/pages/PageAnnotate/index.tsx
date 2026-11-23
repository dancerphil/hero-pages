import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Annotate } from './Annotate';

export const PageAnnotate = () => (
    <div className="simplePage">
        <MantineProvider>
            <Annotate />
        </MantineProvider>
    </div>
);
