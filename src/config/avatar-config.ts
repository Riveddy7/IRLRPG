
export interface AvatarOption {
  key: string;
  src: string;
  alt: string;
  dataAiHint: string;
}

export const avatarOptions: AvatarOption[] = [
  { key: 'avatar1', src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/avatarHombre.webp?alt=media&token=ec2fc4d0-550e-482d-a223-7a0d8d5b557b', alt: 'Avatar Hombre', dataAiHint: 'epic hero' },
  { key: 'avatar2', src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/avatarAi.webp?alt=media&token=df14a347-a5cf-461a-8b8c-d1fd75529f72', alt: 'Avatar AI', dataAiHint: 'fantasy hero' },
  { key: 'avatar3', src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/avatarMujer.webp?alt=media&token=65e6abed-fb11-4568-b637-6bfece2ff4de', alt: 'Avatar Mujer', dataAiHint: 'mystery adventurer' },
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
