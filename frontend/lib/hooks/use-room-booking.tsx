import { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of your context value
interface RoomBookingContextType {
  bookings: Booking[];
  addBooking: (room: string, start: string, time: string, email: string) => Promise<void>;
}

// Define the shape of a booking
interface Booking {
  id?: string;
  room: string;
  start: string;
  time: string;
  email: string;
}

// Create the context with a properly typed initial value
const RoomBookingContext = createContext<RoomBookingContextType | null>(null);

// Define props interface for the provider
interface RoomBookingProviderProps {
  children: ReactNode;
}

export const RoomBookingProvider = ({ children }: RoomBookingProviderProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = async (room: string, start: string, time: string, email: string) => {
    // Call the API to add a booking
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ room, start, time, email }),
    });

    if (!response.ok) {
      throw new Error('Failed to add booking');
    }

    const data = await response.json();
    setBookings((prev) => [...prev, data.booking]);
  };

  return (
    <RoomBookingContext.Provider value={{ bookings, addBooking }}>
      {children}
    </RoomBookingContext.Provider>
  );
};

export const useRoomBooking = (): RoomBookingContextType => {
  const context = useContext(RoomBookingContext);
  if (!context) {
    throw new Error('useRoomBooking must be used within a RoomBookingProvider');
  }
  return context;
};