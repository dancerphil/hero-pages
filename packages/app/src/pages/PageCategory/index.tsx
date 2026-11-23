import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Category } from './Category';

export const PageCategory = () => (
    <div className="simplePage">
        <MantineProvider>
            <Category />
        </MantineProvider>
    </div>
);
