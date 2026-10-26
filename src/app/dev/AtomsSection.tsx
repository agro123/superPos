import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { money, type Money } from '@/shared/domain/money';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Divider,
  Heading,
  IconButton,
  Input,
  Kbd,
  Logo,
  MoneyInput,
  NumberInput,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Text,
} from '@/shared/ui';
import { Specimen } from './Specimen';

export function AtomsSection() {
  const [amount, setAmount] = useState<Money | null>(money(1250000));
  const [quantity, setQuantity] = useState<number | null>(3);
  const [checked, setChecked] = useState(true);
  return (
    <>
      <Specimen name="Button" note="variant × size, loading, disabled, asChild">
        <Button>Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="outline" leftIcon={<Plus aria-hidden className="size-5" />}>
          Con ícono
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Peligro</Button>
        <Button loading>Cargando</Button>
        <Button disabled>Deshabilitado</Button>
        <Button size="lg">Grande</Button>
      </Specimen>
      <Specimen name="IconButton">
        <IconButton label="Agregar" icon={<Plus />} variant="primary" />
        <IconButton label="Eliminar" icon={<Trash2 />} variant="danger" />
        <IconButton label="Agregar (outline)" icon={<Plus />} variant="outline" />
      </Specimen>
      <Specimen name="Input / NumberInput / MoneyInput" note="normal, inválido, deshabilitado">
        <Input aria-label="Normal" placeholder="Normal" className="w-48" />
        <Input aria-label="Inválido" placeholder="Inválido" invalid className="w-48" />
        <Input aria-label="Deshabilitado" placeholder="Deshabilitado" disabled className="w-48" />
        <NumberInput
          aria-label="Cantidad"
          value={quantity}
          onValueChange={setQuantity}
          min={0}
          className="w-32"
        />
        <div className="w-48">
          <MoneyInput aria-label="Precio" currency="COP" value={amount} onValueChange={setAmount} />
        </div>
      </Specimen>
      <Specimen name="Select / Checkbox / Switch">
        <Select
          aria-label="Tipo"
          className="w-56"
          options={[
            { value: 'store', label: 'Tienda' },
            { value: 'cafe', label: 'Cafetería' },
          ]}
          defaultValue="store"
        />
        <Checkbox aria-label="Casilla" checked={checked} onCheckedChange={setChecked} />
        <Switch aria-label="Interruptor" checked={checked} onCheckedChange={setChecked} />
      </Specimen>
      <Specimen name="Badge">
        {(['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const).map((tone) => (
          <Badge key={tone} tone={tone}>
            {tone}
          </Badge>
        ))}
      </Specimen>
      <Specimen name="Avatar / Spinner / Skeleton / Kbd / Logo">
        <Avatar name="Ana Ríos" size="sm" />
        <Avatar name="Carlos Pérez" />
        <Avatar name="Luis" size="lg" />
        <Spinner />
        <Skeleton className="h-6 w-32" />
        <Kbd>F2</Kbd>
        <Logo />
      </Specimen>
      <Specimen name="Heading / Text / Divider">
        <div className="flex w-full flex-col gap-2">
          <Heading level={3} size="xl">
            Heading xl
          </Heading>
          <Heading level={3} size="lg">
            Heading lg
          </Heading>
          <Text>Texto base</Text>
          <Text variant="muted">Texto secundario</Text>
          <Text variant="caption">Leyenda</Text>
          <Text variant="danger">Error</Text>
          <Divider />
        </div>
      </Specimen>
    </>
  );
}
