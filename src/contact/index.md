---
title: Contact us
intro: Call, email or visit the main office.
---
## Visit

{{ site.name }}<br>
{{ site.address }}

[Get directions](https://www.google.com/maps/search/?api=1&query={{ (site.name + ', ' + site.address) | urlencode }})

{% placeholder "Map of the school on Beacon St.", "16 / 9", "Map" %}

## Call or email

- **Phone:** [{{ site.phone }}](tel:+17735345790)
- **Fax:** {{ site.fax }}
- **Email:** [{{ site.email }}](mailto:{{ site.email }})
- **Office hours:** {{ site.hours }}

To visit a classroom or see the school, [book a tour](/about/tours/).
