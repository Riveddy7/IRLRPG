
export interface AvatarOption {
  key: string;
  src: string;
  alt: string;
  dataAiHint: string;
}

export const avatarOptions: AvatarOption[] = [
  { key: 'avatar1', src: 'https://placehold.co/128x128.png?text=Hero1', alt: 'Avatar Épico', dataAiHint: 'epic hero' },
  { key: 'avatar2', src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/Whisk_storyboard7068df975e1e4e83a86c6aed.png?alt=media&token=64923987-e84f-47f8-b505-558283170450', alt: 'Héroe Fantástico', dataAiHint: 'fantasy hero' },
  { key: 'avatar3', src: 'https://placehold.co/128x128.png?text=Hero3', alt: 'Aventurero Misterioso', dataAiHint: 'mystery adventurer' },
];

export const defaultAvatarKey = avatarOptions[0].key;

export function getAvatarDetails(key?: string): AvatarOption {
  const foundAvatar = avatarOptions.find(opt => opt.key === key);
  if (foundAvatar) {
    return foundAvatar;
  }
  // Return the default avatar if no key or key not found
  return avatarOptions.find(opt => opt.key === defaultAvatarKey) || {
    key: 'default',
    src: 'https://placehold.co/128x128.png?text=?',
    alt: 'Avatar por Defecto',
    dataAiHint: 'default avatar'
  };
}
