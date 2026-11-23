import { Markdown } from '@hero-u/mantine';
import '@/styles';
import '@/styles/simplePage';
import './index.css';
import content from './async-await-cookbook.md?raw';

export const PageAsyncAwaitCookbook = () => (
    <div className="simplePage">
        <Markdown>{content}</Markdown>
    </div>
);
