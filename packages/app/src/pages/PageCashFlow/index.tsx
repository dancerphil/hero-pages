import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import '@/styles/simplePage';
import { CashFlow } from './CashFlow';

export const PageCashFlow = () => (
    <div className="simplePage">
        <MantineProvider>
            <CashFlow />
        </MantineProvider>
    </div>
);
