import { useParams } from 'react-router';
import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Read } from './Read';
import { ReadNovel } from './ReadNovel';

export const PageRead = () => {
    const { uuid } = useParams();
    return (
        <div className="simplePage">
            <MantineProvider>
                {uuid ? <ReadNovel uuid={uuid} /> : <Read />}
            </MantineProvider>
        </div>
    );
};
