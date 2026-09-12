# CareerQuest on AWS Ubuntu with Nginx Port 80

This deployment package runs the CareerQuest Node application on **Ubuntu in Amazon EC2**. Nginx listens on public **HTTP port 80** and forwards requests only to the local Node process on port `3000`. No custom domain is required: the public URL is `http://<EC2-PUBLIC-IP>`.

> **Privacy warning:** Port 80 is plain HTTP. Résumé content, career questions, and session data are not encrypted in transit. Use this setup only where HTTP is explicitly required. For real candidate traffic, add a domain and HTTPS before enabling authentication or collecting sensitive information.

## Architecture

```text
Browser ── HTTP :80 ──> Nginx ── localhost:3000 ──> CareerQuest Node service
                                             ├── server job catalogue
                                             └── OpenAI API for insights/chat
```

NGINX uses `proxy_pass` to forward HTTP requests to the local application and forwards host, client IP, and request-protocol headers as documented by NGINX.[1]

## 1. Create the EC2 instance

Launch an **Ubuntu 24.04 LTS** EC2 instance with a public IPv4 address. In the instance security group, allow the following inbound rules.

| Purpose | Protocol | Port | Source |
|---|---:|---:|---|
| Public CareerQuest access | TCP | 80 | `0.0.0.0/0` and `::/0` if IPv6 is enabled |
| Server administration | TCP | 22 | **Your own public IP only** |

AWS/Nginx guidance identifies HTTP as TCP port 80 and recommends enabling HTTP traffic through the EC2 security group for an NGINX instance.[2] Do **not** expose internal port `3000` to the internet.

## 2. Copy the source to the instance

From your computer, upload the current source directory or a ZIP release to the EC2 instance. Replace the placeholders below with your SSH key and public IP.

```bash
scp -i careerquest.pem -r careerquest-matcher ubuntu@<EC2-PUBLIC-IP>:/tmp/
ssh -i careerquest.pem ubuntu@<EC2-PUBLIC-IP>
```

On the Ubuntu instance, install required system packages and create a restricted service account.

```bash
sudo apt update
sudo apt install -y nginx git curl

# Install Node.js 22 LTS from the NodeSource repository, then enable pnpm through Corepack.
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@10.15.1 --activate
node --version
pnpm --version

sudo adduser --system --group --home /opt/careerquest-matcher careerquest
sudo mkdir -p /opt/careerquest-matcher
sudo rsync -a --delete /tmp/careerquest-matcher/ /opt/careerquest-matcher/
sudo chown -R careerquest:careerquest /opt/careerquest-matcher
```

## 3. Install, build, and configure the Node service

```bash
cd /opt/careerquest-matcher
sudo -u careerquest pnpm install --frozen-lockfile
sudo -u careerquest pnpm build

sudo cp deploy/aws-ubuntu/careerquest.env.example /etc/careerquest-matcher.env
sudo nano /etc/careerquest-matcher.env
sudo chown root:careerquest /etc/careerquest-matcher.env
sudo chmod 640 /etc/careerquest-matcher.env
```

Set a real `OPENAI_API_KEY` in `/etc/careerquest-matcher.env`. The self-hosted chatbot now uses this key when Manus Forge credentials are absent. Do not place API keys in frontend files, Git, or the Nginx configuration. NodeSource distributes Node.js packages for Ubuntu, while Corepack activates the project-pinned package manager version.[3] 

## 4. Install systemd and Nginx configuration

```bash
sudo cp deploy/aws-ubuntu/systemd/careerquest.service /etc/systemd/system/careerquest.service
sudo systemctl daemon-reload
sudo systemctl enable --now careerquest

sudo cp deploy/aws-ubuntu/nginx/careerquest.conf /etc/nginx/sites-available/careerquest
sudo ln -sf /etc/nginx/sites-available/careerquest /etc/nginx/sites-enabled/careerquest
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

## 5. Verify the release

Run these checks on the instance, then test the public IP from a browser.

```bash
sudo systemctl status careerquest --no-pager
sudo systemctl status nginx --no-pager
curl -I http://127.0.0.1:3000
curl -I http://<EC2-PUBLIC-IP>
```

The second request should return an HTTP success or redirect response from Nginx. If it fails, inspect the logs:

```bash
sudo journalctl -u careerquest -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

## Important self-hosting notes

| Area | Port-80 behavior | Recommended production posture |
|---|---|---|
| Resume upload | Works through Nginx and remains transient in application memory. | Use HTTPS before requesting real candidate résumés. |
| Career matching | Works from the bundled server-side JSON catalogue. | Keep the catalogue update process access-controlled. |
| AI insights and chat | Require `OPENAI_API_KEY` in `/etc/careerquest-matcher.env`. | Rotate the key and restrict server-file permissions. |
| Manus OAuth login | Not suitable over the public-IP HTTP-only setup because the login flow relies on secure cookies. | Add a domain and TLS before enabling login. |

## Updating the release

Upload the newer source, then repeat the build and restart steps.

```bash
sudo rsync -a --delete /tmp/careerquest-matcher/ /opt/careerquest-matcher/
sudo chown -R careerquest:careerquest /opt/careerquest-matcher
cd /opt/careerquest-matcher
sudo -u careerquest pnpm install --frozen-lockfile
sudo -u careerquest pnpm build
sudo systemctl restart careerquest
sudo nginx -t && sudo systemctl reload nginx
```

## References

[1] [NGINX Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)

[2] [Create Amazon EC2 Instances for NGINX Open Source and NGINX Plus](https://docs.nginx.com/nginx/deployment-guides/amazon-web-services/ec2-instances-for-nginx/)

[3] [NodeSource Node.js Binary Distributions](https://github.com/nodesource/distributions)
