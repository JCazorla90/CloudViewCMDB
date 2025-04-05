# 🌐 CloudView CMDB – Conexión por Rol en AWS

## ✅ Requisitos
- Permisos para crear un IAM Role en tu cuenta AWS

## 🛠️ Paso 1 – Crear un rol de IAM
1. Accede a IAM > Roles > Create role
2. Elige "Another AWS Account"
3. Introduce:
   - Account ID: `<ID de CloudView>`
   - External ID: `cloudview-cmdb-access`

4. Adjunta la siguiente política de solo lectura:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "s3:List*",
        "s3:Get*",
        "rds:Describe*",
        "lambda:List*",
        "iam:List*",
        "cloudwatch:List*",
        "tag:Get*"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Dale nombre: `CloudViewReadOnly`
6. Guarda el ARN del rol generado: `arn:aws:iam::123456789012:role/CloudViewReadOnly`

## ✅ En CloudView
- Método: Rol
- Provider: `aws`
- Role ARN: (el de arriba)
- External ID: `cloudview-cmdb-access`