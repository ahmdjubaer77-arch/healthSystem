import { UserRound } from 'lucide-react'

function ProfileAvatar({ user, size = 'md', className = '', previewUrl = '' }) {
  const profilePicture = user?.profilePicture
  const initials = (user?.name || user?.email || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-2xl',
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-100 ${sizeClasses[size] || sizeClasses.md} ${className}`}
      aria-label={user?.name ? `${user.name}'s profile picture` : 'User profile picture'}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="Profile picture preview" className="h-full w-full object-cover" />
      ) : profilePicture?.url ? (
        <img
          src={profilePicture.url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        <span className="font-bold">{initials}</span>
      ) : (
        <UserRound size={size === 'sm' ? 14 : size === 'xl' ? 36 : 18} aria-hidden="true" />
      )}
    </span>
  )
}

export default ProfileAvatar
