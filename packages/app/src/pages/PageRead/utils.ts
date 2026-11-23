export const getOffsets = ({ paragraphs, charsPerLine, lineHeight, paragraphGap }: {
    paragraphs: string[];
    charsPerLine: number;
    lineHeight: number;
    paragraphGap: number;
}) => {
    const result = [0];
    let top = 0;
    paragraphs.forEach((paragraph) => {
        const lines = Math.ceil(paragraph.length / charsPerLine);
        top += lines * lineHeight + paragraphGap;
        result.push(top);
    });
    return result;
};

export const findIndex = (offsets: number[], y: number) => {
    let low = 0;
    let high = offsets.length - 2;
    while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (offsets[mid] <= y) {
            low = mid;
        }
        else {
            high = mid - 1;
        }
    }
    return low;
};
