export interface NovelRow {
    uuid: string;
    name: string;
    paragraph: number;
    updatedAt: number;
}

export interface AdminNovelRow {
    uuid: string;
    name: string;
    paragraph: number;
    createdAt: string;
    username: string;
    uid: string;
}
