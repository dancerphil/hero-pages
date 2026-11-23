import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Home } from './Home';

export const PageTools = () => (
    <div className="simplePage">
        <MantineProvider>
            <Home />
        </MantineProvider>
    </div>
);
