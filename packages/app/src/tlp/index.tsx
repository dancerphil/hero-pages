import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Tlp } from './Tlp';

export const PageTlp = () => (
    <div className="simplePage">
        <MantineProvider>
            <Tlp />
        </MantineProvider>
    </div>
);
