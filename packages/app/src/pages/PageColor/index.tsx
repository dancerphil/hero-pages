import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import '@/styles/simplePage';
import { Color } from './Color';

export const PageColor = () => (
    <div className="simplePage">
        <MantineProvider>
            <Color />
        </MantineProvider>
    </div>
);
