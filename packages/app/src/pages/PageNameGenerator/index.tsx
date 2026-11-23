import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import '@/styles/simplePage';
import { NameGenerator } from './NameGenerator';

export const PageNameGenerator = () => (
    <div className="simplePage">
        <MantineProvider defaultColorScheme="dark">
            <NameGenerator />
        </MantineProvider>
    </div>
);
