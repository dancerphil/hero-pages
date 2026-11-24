export interface NovelRow {
    id: number;
    name: string;
    createdAt: string;
}

export interface NovelDetail {
    id: number;
    name: string;
    paragraph: number;
}

export interface AdminNovelRow {
    id: number;
    name: string;
    paragraph: number;
    createdAt: string;
    username: string;
    uid: string;
}
