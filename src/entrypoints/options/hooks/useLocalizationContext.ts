import { useContext } from 'preact/hooks';

import { LocalizationContext } from '@/options/components/LocalizationProvider/context';

export const useLocalizationContext = () => useContext(LocalizationContext);
