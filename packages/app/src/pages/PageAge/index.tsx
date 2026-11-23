import { MantineProvider } from '@/components/MantineProvider';
import '@mantine/dates/styles.css';
import '@/styles';
import '@/styles/simplePage';
import { Age } from './Age';

export const PageAge = () => (
    <div className="simplePage">
        <MantineProvider defaultColorScheme="dark">
            <Age />
        </MantineProvider>
    </div>
);
