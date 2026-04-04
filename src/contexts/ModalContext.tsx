import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type ModalType = 'PDV' | 'AGENDAMENTO' | 'NOVO_CLIENTE' | 'MENU_MOBILE' | null;

interface ModalContextData {
  activeModal: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextData>({} as ModalContextData);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const openModal = (type: ModalType) => {
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <ModalContext.Provider value={{ activeModal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
