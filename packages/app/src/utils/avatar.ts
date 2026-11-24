export function avatarSrc(props: { uid: string; avatarUpdatedAt: string | null }) {
    return props.avatarUpdatedAt ? `/api/users/${props.uid}/avatar?v=${encodeURIComponent(props.avatarUpdatedAt)}` : undefined;
}
