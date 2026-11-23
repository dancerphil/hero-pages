import '@/styles';
import { initBlock } from './region';
import { Mine } from './components/Mine';

// eslint-disable-next-line unicorn/no-top-level-side-effects
initBlock();

export const PageMine = () => (
    <div className="simplePage">
        <Mine />
    </div>
);
