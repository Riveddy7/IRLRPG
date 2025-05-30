
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
    fullBodySrc: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/fullbodyHombre.webp?alt=media&token=70051533-fe61-40e7-b1da-357db9188f1c',
    fullBodyDataAiHint: 'male warrior'
  },
  { 
    key: 'avatar2', 
    src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/avatarAi.webp?alt=media&token=df14a347-a5cf-461a-8b8c-d1fd75529f72', 
    alt: 'Avatar Misterioso', 
    dataAiHint: 'fantasy hero',
    fullBodySrc: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/fullbodyAi.webp?alt=media&token=6744bdbc-3f4f-400f-8758-13fa549164a2',
    fullBodyDataAiHint: 'mystic mage'
  },
  { 
    key: 'avatar3', 
    src: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/avatarMujer.webp?alt=media&token=65e6abed-fb11-4568-b637-6bfece2ff4de', 
    alt: 'Avatar Femenino', 
    dataAiHint: 'mystery adventurer',
    fullBodySrc: 'https://firebasestorage.googleapis.com/v0/b/questifyv2-4d669.firebasestorage.app/o/fullbodyMujer.webp?alt=media&token=e0f861ab-9b74-4477-afd0-4b2ef31ac62c',
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
