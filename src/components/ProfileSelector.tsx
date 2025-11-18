import { useState } from 'react';
import { User, Plus, Calendar, ChevronDown } from 'lucide-react';
import { Profile } from '../lib/supabase';

interface ProfileSelectorProps {
  profiles: Profile[];
  currentProfile: Profile | null;
  onSelectProfile: (profile: Profile) => void;
  onAddProfile: () => void;
}

export function ProfileSelector({
  profiles,
  currentProfile,
  onSelectProfile,
  onAddProfile,
}: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return '';
    const age = Math.floor(
      (new Date().getTime() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    return `, ${age} years old`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div className="text-left">
          <div className="font-medium text-gray-900">
            {currentProfile?.name || 'Select Profile'}
          </div>
          {currentProfile?.date_of_birth && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(currentProfile.date_of_birth).toLocaleDateString()}
              {formatAge(currentProfile.date_of_birth)}
            </div>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 w-full min-w-[280px] bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-[400px] overflow-y-auto">
            <div className="p-2">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    onSelectProfile(profile);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                    currentProfile?.id === profile.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentProfile?.id === profile.id
                      ? 'bg-blue-600'
                      : 'bg-gray-100'
                  }`}>
                    <User className={`w-5 h-5 ${
                      currentProfile?.id === profile.id
                        ? 'text-white'
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {profile.name}
                      {profile.is_primary && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Me
                        </span>
                      )}
                    </div>
                    {profile.date_of_birth && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(profile.date_of_birth).toLocaleDateString()}
                        {formatAge(profile.date_of_birth)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  onAddProfile();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Family Member
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
