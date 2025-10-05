// Grid section for Mobbin-style pattern showcase
import { motion } from 'framer-motion';
import { MobbinCard } from './MobbinCard';

interface GridItem {
  title: string;
  description: string;
  image?: string;
  icon?: React.ReactNode;
}

interface GridSectionProps {
  title: string;
  subtitle?: string;
  items: GridItem[];
  columns?: 2 | 3 | 4;
}

export const GridSection = ({ title, subtitle, items, columns = 3 }: GridSectionProps) => {

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h2>
          {subtitle && <p className="text-shallow text-lg max-w-2xl mx-auto">{subtitle}</p>}
        </motion.div>
        
        {/* Grid */}
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
          {items.map((item, index) => (
            <MobbinCard
              key={index}
              title={item.title}
              description={item.description}
              image={item.image}
              icon={item.icon}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
