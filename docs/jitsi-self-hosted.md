# Jitsi self-hosted (opcional)

O MVP grátis usa `meet.jit.si`: a primeira pessoa clica em **“Eu sou o anfitrião”**.

Este guia só é necessário se você quiser um servidor próprio em que a sala inicia sem anfitrião. O software Jitsi é gratuito; o custo é o VPS/domínio.

## App

```bash
NEXT_PUBLIC_JITSI_DOMAIN=meet.seudominio.com
```

O embed envia `enableLobby: false` e `prejoinPageEnabled: false` (só têm efeito se o servidor permitir).

## Servidor (mínimo)

No Prosody, auth anônima e sem lobby obrigatório:

```lua
VirtualHost "meet.seudominio.com"
    authentication = "jitsi-anonymous"
    modules_enabled = {
        "bosh";
        "websocket";
        "ping";
    }
```

Instalação comum: [docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet).

## Verificação

1. Duas abas anônimas na mesma sala.
2. A primeira entra sem “Eu sou o anfitrião”.
3. A segunda vê o vídeo assim que a sala existir.
