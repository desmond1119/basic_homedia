import { SocialLinks as SocialLinksType } from '../domain/Provider.types';
import {
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface SocialLinksProps {
  socialLinks: SocialLinksType;
}

export const SocialLinks = ({ socialLinks }: SocialLinksProps) => {
  const links = [
    {
      key: 'phone',
      icon: PhoneIcon,
      label: socialLinks.phone,
      href: socialLinks.phone ? `tel:${socialLinks.phone}` : null,
    },
    {
      key: 'email',
      icon: EnvelopeIcon,
      label: socialLinks.email,
      href: socialLinks.email ? `mailto:${socialLinks.email}` : null,
    },
    {
      key: 'website',
      icon: GlobeAltIcon,
      label: socialLinks.website,
      href: socialLinks.website,
    },
  ].filter((link) => link.label);

  const socialIcons = [
    {
      key: 'facebook',
      label: 'Facebook',
      url: socialLinks.facebook,
      icon: '📘',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      url: socialLinks.instagram,
      icon: '📷',
    },
    {
      key: 'youtube',
      label: 'YouTube',
      url: socialLinks.youtube,
      icon: '📺',
    },
  ].filter((social) => social.url);

  return (
    <div className="space-y-3">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.key}
            href={link.href || '#'}
            className="flex items-center gap-3 text-shallow hover:text-white transition group"
          >
            <Icon className="w-5 h-5 text-gray-500 group-hover:text-white transition" />
            <span className="text-sm">{link.label}</span>
          </a>
        );
      })}

      {socialIcons.length > 0 && (
        <div className="pt-3 border-t border-gray-800">
          <div className="flex gap-2">
            {socialIcons.map((social) => (
              <a
                key={social.key}
                href={social.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-sm text-gray-300 hover:text-white"
                title={social.label}
              >
                <span>{social.icon}</span>
                <span>{social.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
