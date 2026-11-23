import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import '@/styles/simplePage';
import { AdAnalyzer } from './AdAnalyzer';

export const PageAdAnalyzer = () => (
    <div className="simplePage">
        <MantineProvider>
            <AdAnalyzer />
        </MantineProvider>
    </div>
);
