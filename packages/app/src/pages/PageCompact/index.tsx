import { Notifications } from '@mantine/notifications';
import { MantineProvider } from '@/components/MantineProvider';
import '@mantine/notifications/styles.css';
import '@/styles';
import '@/styles/simplePage';
// import '@/styles/dark';
import { Compact } from './Compact';

export const PageCompact = () => (
    <div className="simplePage">
        <MantineProvider>
            <Notifications />
            <Compact />
        </MantineProvider>
    </div>
);
