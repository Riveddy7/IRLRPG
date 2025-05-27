
export interface AvatarOption {
  key: string;
  src: string; // For headshot/profile
  alt: string;
  dataAiHint: string;
  fullBodySrc: string; // For full-body display in quiz
  fullBodyDataAiHint: string;
}

export const avatarOptions: AvatarOption[] = [
  { 
    key: 'avatar1', 
    src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/avatarHombre.webp?alt=media&token=ec2fc4d0-550e-482d-a223-7a0d8d5b557b', 
    alt: 'Avatar Masculino', 
    dataAiHint: 'epic hero',
    fullBodySrc: 'https://placehold.co/270x480.png?text=Hero+1',
    fullBodyDataAiHint: 'male warrior'
  },
  { 
    key: 'avatar2', 
    src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/Whisk_storyboard7068df975e1e4e83a86c6aed.png?alt=media&token=64923987-e84f-47f8-b505-558283170450', 
    alt: 'Avatar Misterioso', 
    dataAiHint: 'fantasy hero',
    fullBodySrc: 'https://placehold.co/270x480.png?text=Mage+1',
    fullBodyDataAiHint: 'mystic mage'
  },
  { 
    key: 'avatar3', 
    src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/avatarMujer.webp?alt=media&token=65e6abed-fb11-4568-b637-6bfece2ff4de', 
    alt: 'Avatar Femenino', 
    dataAiHint: 'mystery adventurer',
    fullBodySrc: 'https://placehold.co/270x480.png?text=Heroine+1',
    fullBodyDataAiHint: 'female archer'
  },
];

export const defaultAvatarKey = avatarOptions[0].key;

// This function primarily serves the dashboard avatar.
// If needed for full body elsewhere, it could be extended.
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
    dataAiHint: 'default avatar',
    fullBodySrc: 'https://placehold.co/270x480.png?text=Default',
    fullBodyDataAiHint: 'default character'
  };
}
