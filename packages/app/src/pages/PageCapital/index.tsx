import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Capital } from './Capital';

export const PageCapital = () => (
    <div className="simplePage">
        <MantineProvider>
            <Capital />
        </MantineProvider>
    </div>
);
