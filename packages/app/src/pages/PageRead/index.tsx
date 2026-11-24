import { useParams } from 'react-router';
import { MantineProvider } from '@/components/MantineProvider';
import '@/styles';
import { Read } from './Read';
import { ReadNovel } from './ReadNovel';

export const PageRead = () => {
    const { id } = useParams();
    return (
        <div className="simplePage">
            <MantineProvider>
                {id ? <ReadNovel id={Number(id)} /> : <Read />}
            </MantineProvider>
        </div>
    );
};
